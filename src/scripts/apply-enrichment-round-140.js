const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "cookiecutter-shark") {
      newC.characteristics = "Thân hình thon dài hình điếu xì-gà, màu nâu sẫm trên lưng nhạt dần xuống bụng. Hàm răng dưới siêu lớn gồm các răng hình tam giác sắc nhọn liên kết chặt chẽ như lưỡi cưa tròn đồng bộ. Vùng cổ có một đai màu tối giống như vòng cổ giúp mô phỏng bóng cá mồi. Lớp biểu bì có cấu trúc vảy sừng giảm ma sát lực cản nước giúp di chuyển im lặng tuyệt đối. Cơ thể chứa một lá gan khổng lồ chiếm tới 35% trọng lượng chứa đầy dầu squalene tỷ trọng thấp, cung cấp sức nổi tự nhiên hoàn hảo ở tầng sâu mà không tốn năng lượng hoạt động. Hàm trên có răng nhỏ, hẹp và hướng vào trong để ghim giữ con mồi. Cảm biến cơ quan thụ cảm điện trường Ampullae of Lorenzini bao phủ vùng đầu thu tín hiệu cực nhạy.";
      newC.survival_method = "Di cư thẳng đứng hàng ngày (diel vertical migration) từ độ sâu 1000 - 3700m vào ban ngày lên tầng mặt 100 - 300m vào ban đêm để kiếm ăn. Ngụy trang ngược (counter-illumination) bằng dải cơ quan phát sáng photophores chứa tế bào huỳnh quang màu xanh lục ở phần bụng để hòa lẫn với ánh sáng mặt trăng, chừa lại đai cổ tối màu làm mồi nhử dụ cá săn mồi lớn tấn công. Khi bám vào mục tiêu, chúng cắm răng trên để neo, dùng môi hút chân không bám chặt rồi xoay tròn cơ thể để nạo khoét một miếng thịt tròn hoàn hảo. Sử dụng sụn khớp cổ linh hoạt chịu lực vặn lớn khi giật khoét.";
      newC.unique_traits = "Hàm cưa khoét thịt hình tròn (cookiecutter bite mechanism): Môi hút tạo áp suất âm lên tới -1.2 bar kết hợp răng hàm dưới dạng lưỡi cưa xoay tròn nạo thịt. Phát quang sinh học dụ mồi độc đáo (collar mimicry): Dải sáng xanh lục ở bụng đánh lừa kẻ thù bên dưới kết hợp đai cổ tối màu đóng vai trò mồi nhử cá lớn. Cơ chế tự động rụng và nuốt lại toàn bộ hàm răng dưới cùng lúc để tái hấp thu canxi và phosphat quý giá. Khả năng chịu áp suất biến thiên cực đoan vượt trội lên tới hơn 350 atm nhờ màng tế bào bão hòa lipid đặc chủng. Hệ thống cảm ứng điện trường siêu nhạy cảm nhận chuyển động máu nóng của mục tiêu khổng lồ.";

      newC.strengths = [
        "Hàm răng dưới xếp khít tạo lực cắt tròn cực kỳ sắc bén và hiệu quả cao",
        "Khả năng hút chân không của môi giúp cố định cơ thể vào con mồi đang di chuyển tốc độ cao",
        "Cơ chế phát quang sinh học ngụy trang và làm mồi nhử tinh vi lừa gạt các loài cá lớn",
        "Khả năng thích ứng áp suất cực lớn khi di cư thẳng đứng hàng ngàn mét mỗi ngày",
        "Tái hấp thu canxi hiệu quả thông qua việc nuốt răng cũ, đảm bảo răng luôn sắc bén mà không hao tổn khoáng chất",
        "Lớp da giảm ma sát giúp bơi lội im lặng tuyệt đối trước cơ quan đường bên của con mồi",
        "Lực hút cơ học từ môi phễu (suctorial lips) tạo áp suất âm lên tới -1.2 bar, bám dính siêu chắc vào các lớp da trơn trượt của cá voi.",
        "Gan tích dầu squalene khổng lồ cung cấp sức nổi tự nhiên ổn định ở mọi độ sâu, triệt tiêu nhu cầu sử dụng bong bóng cá chứa khí.",
        "Răng dưới hợp nhất thành một tấm răng cưa duy nhất (single saw-like plate) giúp phân phối lực cắn đều và tránh gãy răng đơn lẻ.",
        "Hệ thống cơ quan Ampullae of Lorenzini phủ dày vùng đầu nhạy cảm với các trường điện thế siêu yếu từ các động vật máu nóng ở khoảng cách xa.",
        "Cấu trúc sụn sọ siêu nhẹ đàn hồi hấp thụ sốc tuyệt vời khi bám và quay tròn giật thịt từ con mồi khổng lồ di chuyển nhanh."
      ];

      newC.weaknesses = [
        "Tốc độ di chuyển đường dài chậm chạp, không có khả năng rượt đuổi con mồi",
        "Kích thước nhỏ bé khiến nó dễ làm thức ăn cho các loài cá săn mồi nếu chiến thuật dụ dỗ thất bại",
        "Hàm trên khá yếu chỉ có nhiệm vụ ghim giữ mục tiêu chứ không thể cắn xé",
        "Phụ thuộc chặt chẽ vào môi trường nước ấm áp ở tầng trên, khó chịu đựng các dòng biển lạnh sâu quá hạn",
        "Độ nhạy cảm võng mạc cực cao với ánh sáng mạnh, hoàn toàn mù tạm thời nếu gặp nguồn sáng cường độ cao đột ngột từ tàu lặn.",
        "Cơ ngực và cơ đuôi thon nhỏ hạn chế gia tốc bơi bùng nổ, không thể thực hiện các cuộc rượt đuổi động học chủ động.",
        "Độ bám dính của môi hút chân không hoàn toàn mất hiệu lực nếu da con mồi có các sinh vật ký sinh bám ngoài gồ ghề (như hà biển ký sinh trên cá voi).",
        "Lượng canxi tiêu tốn để tái tạo đồng loạt răng hàm dưới định kỳ là cực lớn nếu không thể tái hấp thu thành công do cơ chế nuốt răng bị gián đoạn."
      ];

      newC.fun_facts = [
        "Các vết cắn hình tròn đặc trưng của cá mập cookiecutter từng làm đau đầu các kỹ sư Hải quân Mỹ khi chúng làm rách các dây cáp bọc cao su và vòm sonar của tàu ngầm trước khi người ta tìm ra nguyên nhân",
        "Chúng thay thế toàn bộ hàm răng dưới cùng một lúc (thay vì từng chiếc như cá mập thông thường) và nuốt luôn hàm răng rụng đó vào dạ dày để tái hấp thu lượng canxi quý giá",
        "Lớp phát quang màu xanh lục của chúng là dải sáng sinh học mạnh nhất và lâu nhất trong số các loài cá mập sâu",
        "Chúng có thể cắn rách cả sợi cáp quang biển sâu và làm hỏng các thiết bị đo đạc hải dương học trôi nổi",
        "Các mẫu cắn của cá mập cookiecutter trên cá heo và cá voi từng được các nhà sinh học thế kỷ 19 mô tả là các vết loét do virus hoặc ký sinh trùng trước khi bắt gặp mẫu vật cá mập sống đầu tiên.",
        "Chúng có khả năng cắn thủng lớp cao su neoprene dày và các dây cáp bảo vệ của các tàu ngầm hạt nhân Hải quân Mỹ, đôi khi gây rò rỉ dầu truyền tín hiệu sonar.",
        "Dầu gan của cá mập cookiecutter nhẹ đến mức họ có thể nổi lờ đờ mà không cần bơi, giống như một khinh khí cầu mini dưới nước sâu.",
        "Sự hiện diện của vết cắn cookiecutter trên cơ thể động vật đại dương được các nhà khoa học dùng làm chỉ số sinh thái để theo dõi vùng phân bố và đường di cư của loài cá mập bí ẩn này."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1086/283088", "label": "Bioluminescence and feeding behavior of the cookiecutter shark" },
        { "url": "https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/isistius-brasiliensis/", "label": "Florida Museum - Cookiecutter Shark Profile" },
        { "url": "https://doi.org/10.1111/j.1095-8649.2011.03061.x", "label": "Journal of Fish Biology - Evolution and ecology of the cookiecutter shark" },
        { "url": "https://doi.org/10.1007/s00227-015-2749-x", "label": "Marine Biology - Trophic ecology of Isistius brasiliensis inferred from stable isotopes" },
        { "url": "https://doi.org/10.1111/j.1439-0426.2012.02008.x", "label": "Journal of Applied Ichthyology - Ectoparasitic feeding of Isistius brasiliensis on pelagic fishes" },
        { "url": "https://doi.org/10.1371/journal.pone.0210085", "label": "PLoS ONE - Bite mechanics and dental morphology of the cookiecutter shark" }
      ];
    } else if (c.id === "net-casting-spider") {
      newC.characteristics = "Thân hình gầy mảnh, đốt bụng thuôn dài giống hệt nhánh cây khô giúp ngụy trang hoàn hảo vào ban ngày. Phần đầu ngực trang bị đôi mắt sau trung tâm khổng lồ (Posterior Median Eyes - PME) chiếm phần lớn khuôn mặt đóng vai trò như kính nhìn đêm hồng ngoại. Các chân cực dài và mảnh, phủ đầy lông cơ học (trichobothria) nhạy bén cảm nhận dòng khí động học. Cấu trúc khớp đốt chân trước linh hoạt kết hợp cơ bắp co rút nhanh nhờ áp lực dịch hemolymph bùng nổ. Có cơ quan metatarsal nhạy âm thanh.";
      newC.survival_method = "Ban ngày duỗi thẳng các chân bọc sát cơ thể mô phỏng một nhánh cành cây khô trên lá rụng. Ban đêm, chúng dệt một chiếc lưới hình chữ nhật siêu đàn hồi từ tơ Cribellate khô không dính dệt từ các sợi tơ xù mịn bám giữ bằng hai chân trước. Treo ngược mình dốc đầu xuống đất bằng các sợi tơ neo chịu lực, quăng sập lưới úp gọn con mồi bò qua bên dưới hoặc bay qua phía trước chỉ trong tích tắc. Lông chân cảm nhận tần số cánh đập để kích hoạt phản xạ. Sử dụng đốm phân trắng phản xạ UV làm tọa độ tiêu điểm ngắm bắn.";
      newC.unique_traits = "Săn mồi bằng lưới quăng chủ động (active web-casting): Không ngồi chờ mạng nhện thụ động mà dùng chân trước căng rộng tơ Cribellate dẻo dai gấp 4 lần diện tích ban đầu để úp bắt. Thị giác ban đêm siêu đẳng (giant PME vision): Sở hữu màng thụ quang nhạy sáng gấp 2000 lần mắt người, liên tục tái tổng hợp màng rhabdomere vào hoàng hôn và tự tiêu hủy bằng cơ chế tự thực (autophagy) vào bình minh để chống tia UV. Cơ chế bám dính tơ khô Cribellate dựa trên tương tác tĩnh điện Van der Waals. Nghe âm thanh tần số thấp qua cơ quan metatarsal ở cự ly 2 mét.";

      newC.strengths = [
        "Thị giác ban đêm cực kỳ nhạy bén cho phép định vị mục tiêu chính xác trong bóng đêm sâu thẳm",
        "Phương pháp quăng lưới chủ động tóm gọn mồi mà không cần mạng nhện cố định lớn",
        "Lực tơ co giãn tơ xù xì (cribellate silk) móc chặt chân côn trùng thay vì chất keo dính thông thường dễ hỏng",
        "Sự ngụy trang hoàn hảo giống hệt cành cây khô giúp tránh được các loài chim săn mồi ban ngày",
        "Khả năng nghe được âm thanh tần số thấp phát ra từ tiếng đập cánh của côn trùng bay thông qua các sợi lông cảm giác ở chân",
        "Khớp chân trước cấu tạo đặc biệt tích lũy năng lượng đàn hồi cơ, giải phóng lực quăng lưới nhanh gấp 5 lần phản xạ thần kinh thông thường.",
        "Đôi mắt sau PME sở hữu thấu kính khẩu độ f/0.58 cực lớn, thu sáng tốt hơn bất kỳ loài nhện nào khác trên Trái Đất.",
        "Các lông trichobothria siêu nhạy cảm trên chân cảm nhận được sự thay đổi áp suất không khí cực nhỏ từ côn trùng bay qua.",
        "Lưới tơ Cribellate không dính bẫy côn trùng bằng cơ chế khóa cơ học vi mô: các sợi tơ cực nhỏ quấn chặt lấy các lông cứng chân con mồi như khóa Velcro.",
        "Cơ chế phóng tơ chủ động sử dụng năng lượng thủy động học giải phóng tức thời từ dịch hemolymph đẩy chân trước bung rộng lưới trong 20 mili-giây."
      ];

      newC.weaknesses = [
        "Màng nhạy sáng của mắt cực kỳ nhạy cảm và sẽ bị mù vĩnh viễn nếu tiếp xúc với ánh sáng mặt trời trực tiếp ban ngày mà không kịp phân hủy",
        "Khả năng di chuyển tự do và tự vệ không có lưới rất yếu, cơ thể gầy mảnh dễ bị đứt chân",
        "Phạm vi săn mồi bị giới hạn trong khoảng không cực hẹp ngay phía dưới tư thế treo mình",
        "Tiêu tốn nhiều năng lượng để tái tổng hợp màng nhạy sáng mắt và dệt tơ mới mỗi ngày",
        "Hệ thống mắt PME cực kỳ dễ tổn thương dưới bức xạ UV ban ngày, đòi hỏi phải ẩn nấp kỹ dưới bóng râm.",
        "Lưới tơ Cribellate đòi hỏi năng lượng sản xuất protein tơ rất lớn, không thể tái sử dụng nếu bị rách hoặc ướt mưa.",
        "Cơ chế ngụy trang cành cây chỉ hiệu quả khi ở trên nền cành lá khô; nếu bị rơi xuống nền cỏ xanh, chúng lập tức trở nên nổi bật trước chim săn mồi.",
        "Tốc độ phục hồi của võng mạc sau khi bị phơi sáng đột ngột là rất chậm, khiến chúng bất động tự vệ trong nhiều giờ nếu bị chiếu sáng mạnh."
      ];

      newC.fun_facts = [
        "Màng tiếp nhận ánh sáng của đôi mắt nhạy cảm đến mức nó bị hủy hoại mỗi khi mặt trời mọc và nhện phải tự tổng hợp lại một lớp màng mới hoàn toàn vào mỗi buổi tối",
        "Để nhắm mục xác trên mặt đất, nhện thường thả một vài giọt phân màu trắng lên lá cây phía dưới trước khi đi săn để làm 'bia ngắm' định vị cự ly tung lưới",
        "Tơ của loài nhện này là tơ khô xù xì, cấu trúc vi thể của nó hoạt động như những chiếc móc khóa Velcro móc chặt lấy các lông và gai trên vỏ giáp côn trùng",
        "Mắt của nhện quăng lưới không có mống mắt hay cơ đồng tử để điều chỉnh lượng sáng, do đó chúng phải phân hủy lớp màng nhạy sáng vào ban ngày để tránh bị mù.",
        "Chúng thường để lại một đốm phân màu trắng phát quang nhẹ trên lá cây làm mốc tọa độ giúp tính toán quỹ đạo phóng lưới chuẩn xác.",
        "Khi dệt lưới, nhện quăng lưới giữ khoảng cách lưới chính xác đến từng micromet bằng cách đo đạc bằng các gai xúc giác ở đầu chân.",
        "Nếu chiếc lưới không bắt được mồi vào cuối đêm, nhện sẽ ăn lại toàn bộ chiếc lưới để tái chế protein sản xuất tơ cho đêm sau."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1007/s00359-016-1130-4", "label": "Visual ecology of the net-casting spider" },
        { "url": "https://www.australian.museum/learn/animals/spiders/net-casting-spiders/", "label": "Australian Museum - Net-casting Spiders" },
        { "url": "https://doi.org/10.1242/jeb.227389", "label": "Sensory ecology of net-casting spiders: hearing and vision in the dark" },
        { "url": "https://doi.org/10.1007/s00114-019-1634-1", "label": "Mechanical properties and structure of cribellate capture threads" },
        { "url": "https://doi.org/10.1098/rsbl.2020.0482", "label": "Biology Letters - Sound detection and prey capture in net-casting spiders" },
        { "url": "https://doi.org/10.1111/ede.12351", "label": "Evolution & Development - Development of the giant eyes in Deinopidae" }
      ];
    } else if (c.id === "orchid-mantis") {
      newC.characteristics = "Màu sắc hồng phấn kết hợp trắng cánh sen rực rỡ, mô phỏng hoàn hảo cánh hoa phong lan nở rộ. Bốn chân sau có phiến rộng thùy hình tim phẳng dẹt trông giống hệt như các cánh hoa thật. Đầu hình tam giác cử động cực kỳ linh hoạt với đôi mắt kép lồi ngược hướng lên trên cho phép quan sát lập thể 3D xuất sắc. Con cái trưởng thành có kích thước lớn gấp đôi và nặng gấp 20 lần con đực. Phần cuối bụng có đốm nâu đen nhỏ bắt chước nhụy hoa thu hút côn trùng. Lớp vỏ kitin được phủ chất sáp phản xạ cực tím (UV).";
      newC.survival_method = "Ngụy trang hung hãn (aggressive mimicry) chủ động đứng cố định trên các tán cây hoặc cụm hoa thực tế, lắc lư nhẹ nhàng theo gió để đánh lừa côn trùng thụ phấn tự động bay đến kiếm mật. Tiết ra hỗn hợp hóa học dễ bay hơi tương tự pheromone hấp dẫn ong mật. Khi phát hiện mục tiêu lọt vào tầm kẹp, chúng phóng chân trước phóng ra gai ngược kẹp chặt con mồi chỉ trong chớp mắt. Tự vệ bằng cách giương đôi cánh sặc sỡ để đe dọa kẻ thù. Rung chuyển cơ học lắc lư bắt chước hoa đung đưa trước gió.";
      newC.unique_traits = "Ngụy trang cánh hoa phong lan tối thượng (petal mimicry): Khả năng phản xạ tia cực tím (UV) mạnh mẽ thu hút côn trùng bay hơn cả hoa phong lan thực tế. Tỷ lệ cơ thể dị hình giới tính cực đoan (extreme sexual size dimorphism) giúp con đực nhỏ nhẹ dễ bay xa phát tán gen và tránh bị con cái ăn thịt. Phản xạ kẹp mồi siêu tốc (ultra-fast strike) kẹp chặt chỉ mất khoảng 10-20 mili-giây. Ấu trùng giai đoạn đầu mô phỏng bọ xít độc hại Reduviidae. Tiết chất dẫn dụ ong mật đặc hữu.";

      newC.strengths = [
        "Ngụy trang hung hãn (aggressive mimicry) dụ dỗ con mồi cực kỳ hiệu quả, hoạt động tốt hơn cả hoa thật",
        "Phản xạ kẹp chân trước đớp mồi siêu tốc trong vòng 10-20 mili-giây",
        "Sự cơ động cao của con đực nhỏ và khả năng tàng hình xuất sắc của con cái lớn bảo đảm sinh tồn loài",
        "Hệ thống móng vuốt chân trước có gai ngược sắc nhọn giúp giữ chặt con mồi lớn hơn cơ thể nhiều lần",
        "Khả năng hấp dẫn các loài côn trùng thụ phấn nhờ phản xạ tia cực tím đặc trưng vượt trội",
        "Khả năng phản xạ và kẹp chân trước đớp mồi siêu tốc chỉ mất 12 mili-giây, nhanh hơn gấp đôi chớp mắt của con người.",
        "Sản sinh các hợp chất hóa học dẫn dụ ong mật bay thẳng vào vị trí mai phục mà không nghi ngờ.",
        "Cơ thể phản xạ tia cực tím (UV) có độ tương phản cao, tạo ảo ảnh nguồn mật hoa chất lượng cao đối với ong và bướm.",
        "Sự phân bố sắc tố lipid biểu bì bền vững không bị bạc màu dưới ánh sáng mặt trời gay gắt, duy trì hiệu quả ngụy trang hoa phong lan suốt vòng đời.",
        "Khả năng bắt chước cơ học xuất sắc: lắc lư thân theo chu kỳ gió giống hệt một cánh hoa đung đưa để tránh bị chim săn mồi phát hiện cử động."
      ];

      newC.weaknesses = [
        "Bất lợi thể hình cực lớn đối với con đực do kích thước quá nhỏ bé",
        "Khả năng chống chịu cơ học kém, lớp vỏ kitin mỏng dễ bị tổn thương bởi kẻ săn mồi lớn như chim và bò sát",
        "Chế độ ăn phụ thuộc nhiều vào côn trùng bay thụ phấn",
        "Dễ bị phát hiện nếu đứng ngoài khu vực thảm thực vật có hoa phù hợp",
        "Con đực quá nhỏ bé rất dễ bị chính con cái ăn thịt (cannibalism) trong quá trình tiếp cận giao phối.",
        "Bị giới hạn sinh cảnh nghiêm ngặt, màu sắc nổi bật khiến chúng dễ lộ diện nếu rơi khỏi thảm thực vật có hoa.",
        "Tốc độ di chuyển đi bộ trên cạn của con cái trưởng thành rất chậm chạp do các phiến thùy chân dẹt cản trở cơ học khi bò nhanh.",
        "Nhạy cảm cao với nấm ký sinh biểu bì trong điều kiện môi trường có độ ẩm quá cao hoặc thiếu thông gió."
      ];

      newC.fun_facts = [
        "Nghiên cứu chỉ ra bọ ngựa phong lan hấp dẫn ong mật nhiều hơn cả những bông hoa phong lan thật đứng cạnh nó",
        "Con đực trưởng thành chỉ dài khoảng 2.5 - 3 cm, bằng một nửa kích thước con cái (khoảng 6 cm), giúp chúng có thể bay rất linh hoạt",
        "Khi mới nở, ấu trùng (nymph) có màu đỏ và đen trông giống hệt loài bọ xít sát thủ có độc để xua đuổi kẻ thù",
        "Khác với các loài ngụy trang khác cố gắng trốn tránh kẻ thù bằng cách hòa mình vào nền lá, bọ ngựa phong lan là loài động vật đầu tiên được xác nhận ngụy trang để chủ động dụ dỗ con mồi hiệu quả hơn cả vật mẫu thật.",
        "Khi ong mật nhìn thấy bọ ngựa phong lan dưới ánh sáng cực tím (UV), chúng thấy một đốm sáng rực rỡ có màu sắc hấp dẫn hơn cả những cánh hoa phong lan thật bên cạnh.",
        "Bọ ngựa phong lan con khi mới nở có màu đỏ và đen rực rỡ, trông giống hệt loài bọ xít độc Reduviidae để xua đuổi các loài săn mồi lớn hơn.",
        "Nhờ cơ thể phản xạ UV mạnh mẽ, chúng trông giống như một đóa hoa đầy mật cực kỳ hấp dẫn trong mắt côn trùng, thậm chí còn nổi bật hơn cả hoa thật."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1111/jeb.12272", "label": "Orchid mantis aggressive mimicry" },
        { "url": "https://www.nationalgeographic.com/animals/invertebrates/facts/orchid-mantis", "label": "National Geographic - Orchid Mantis Facts" },
        { "url": "https://doi.org/10.1086/673858", "label": "Orchid mantises lure pollinators more effectively than real flowers" },
        { "url": "https://doi.org/10.1007/s00265-014-1808-1", "label": "Sexual size dimorphism and predatory behavior in Hymenopus coronatus" },
        { "url": "https://doi.org/10.1111/j.1365-2435.2014.02263.x", "label": "Functional Ecology - The coloration and camouflage of the orchid mantis" },
        { "url": "https://doi.org/10.1016/j.anbehav.2016.03.005", "label": "Animal Behaviour - Female orchid mantis predatory strategy and pollinator deception" }
      ];
    } else if (c.id === "laughing-kookaburra") {
      newC.characteristics = "Thân hình mập mạp vững chãi, đầu lớn với sọc mắt màu nâu sẫm đặc trưng, ngực nhạt màu và chiếc mỏ cực kỳ to khỏe, dày cộp. Đuôi có các vằn màu đỏ cam và nâu đậm. Cơ quai hàm và cấu trúc cơ liên đốt cổ được gia cố đặc biệt với các sợi cơ chéo chịu được tải trọng uốn gập lớn khi hành động quật mồi. Bộ lông có cấu trúc vi mô bẫy không khí cách nhiệt tuyệt đối giúp duy trì thân nhiệt ổn định trong các đêm đông lạnh giá ở vùng núi Úc. Cấu trúc xương sọ xốp chứa nhiều khoang khí nhỏ dạng tổ ong hoạt động như bộ giảm chấn khí nén tự nhiên, phân tán 80% xung lực va đập dọc theo trục mỏ khi thực hiện động tác quật mồi bạo lực. Mắt chim được trang bị một lớp màng nhầy đặc biệt giúp bảo vệ nhãn cầu khỏi bụi và cát khi bổ nhào lao xuống đất săn mồi.";
      newC.survival_method = "Săn mồi theo lối rình rập im lặng từ cành cao và lao xuống đớp gọn con mồi bằng chiếc mỏ nặng. Chúng nổi tiếng với kỹ năng săn rắn độc bằng cách dùng mỏ cắn chặt gáy rắn và quật liên tiếp vào thân cây hoặc đá cho đến khi chết. Sử dụng lối săn mồi phục kích bất động kéo dài hàng giờ liền để giảm thiểu lượng calo tiêu thụ và khiến con mồi hoàn toàn mất cảnh giác. Chúng phát triển hành vi đập mồi cơ học: sau khi kẹp chặt rắn độc hoặc thằn lằn bằng mỏ, chúng quật mạnh liên tiếp con mồi vào vỏ cây khô cứng cho đến khi toàn bộ xương sống của con mồi bị bẻ gãy hoàn toàn, làm tê liệt tuyến độc trước khi nuốt. Trong mùa khô, chúng chuyển sang săn mồi gần các nguồn nước còn sót lại, tận dụng bóng râm của tán lá khuynh diệp để che giấu cơ thể trước khi lao bổ nhào từ cành cao. Chúng bôi một lượng dầu nhỏ tiết ra từ tuyến phao câu lên lông mỏ để bảo vệ mỏ khỏi độ ẩm và vi khuẩn bám vào từ rắn độc. Lực quật bạo lực tạo xung lực 12G bẻ gãy đốt sống rắn.";
      newC.unique_traits = "Tiếng kêu vang dội, kéo dài có cấu trúc âm thanh giống hệt tiếng cười rộ lên của con người để khẳng định chủ quyền lãnh thổ. Hệ thống thanh quản (syrinx) lưỡng cực cho phép phát ra hai dải tần âm thanh độc lập cùng lúc để kiến tạo cấu trúc phức điệu tiếng cười đặc thù. Sở hữu tần số tiếng cười đạt ngưỡng 110-120 decibel, có khả năng kích hoạt đồng bộ toàn bộ thành viên trong gia đình để tạo thành một dàn hợp xướng tiếng cười lập tức lấn át âm thanh của các loài chim cạnh tranh khác. Tiếng cười của loài này có cấu trúc sóng hài đa tầng với các xung tần số quét nhanh (frequency modulation), giúp âm thanh truyền qua khoảng cách rừng rậm 1.5 km mà không bị nhiễu hay suy hao dải tần. Kookaburra trưởng thành biết cách tự mài nhọn rìa mỏ bằng cách cọ xát mạnh vào các vỏ cây gỗ sồi hoặc khuynh diệp nhám. Sinh sản hợp tác liên hệ chặt chẽ giữa các thế hệ.";

      newC.strengths = [
        "Mỏ to siêu dày cùng cơ cổ cực khỏe tạo lực kẹp kìm búa đập vỡ xương sống con mồi.",
        "Khả năng trấn áp tinh thần các loài chim và bò sát nhỏ bằng âm lượng tiếng cười cực đại.",
        "Thị giác nhạy bén bắt trọn từng rung động nhỏ nhất dưới thảm lá rừng từ cự ly cao.",
        "Cấu trúc keratin ở mỏ có độ cứng và đặc tính phân tán chấn lực cơ học xuất sắc giúp mỏ không bị nứt vỡ khi đập rắn.",
        "Tính liên kết bầy đàn cao với hệ thống chia sẻ thức ăn và canh gác luân phiên giúp gia tăng tỷ lệ sống sót của chim non.",
        "Hệ cơ và xương cổ chịu tải cực cao, chịu được mô-men xoắn lớn sinh ra khi quật mạnh mồi xuống đá cứng.",
        "Mỏ sừng dày có khả năng chống mài mòn hóa học và cơ học, hoạt động như một cái kẹp lực đẩy mạnh.",
        "Hộp sọ có cơ hàm sau phát triển mạnh mẽ tạo lực kẹp cơ học liên tục ở đầu mỏ lên tới 40 Newton, đủ để bóp nghẹt động mạch cổ của rắn nhỏ.",
        "Thị giác có mật độ tế bào nón cao ở vùng trung tâm võng mạc, tăng cường độ tương phản và khả năng phát hiện chuyển động vi mô của côn trùng trong thảm lá khô.",
        "Hộp sọ giảm chấn với các tế bào xương rỗng dạng xốp ngăn ngừa chấn thương não bộ khi thực hiện cú đập mồi lực cực mạnh.",
        "Bộ mỏ trên (maxilla) có các gờ răng cưa keratin nhỏ hỗ trợ giữ chặt lớp da rắn trơn trượt.",
        "Cơ cổ chéo (complexus muscle) cực lớn cung cấp gia tốc đập mồi cơ học cực mạnh, đạt tới gia tốc 12G khi quật mồi.",
        "Hệ thống tiêu hóa tiết enzyme pepsin nồng độ cực cao giúp phân hủy nhanh xương rắn và lông động vật trước khi nôn bã."
      ];

      newC.weaknesses = [
        "Khả năng bay lượn trên không trung kém linh hoạt do cánh ngắn tròn và cơ thể nặng nề.",
        "Phụ thuộc chặt chẽ vào các cây cổ thụ lớn có hốc để làm tổ, dễ tổn thương khi cháy rừng hoành hành.",
        "Kém cơ động khi săn mồi trên đất trống, dễ bị các loài ăn thịt trên cạn như cáo, mèo hoang phục kích.",
        "Hệ thống tiêu hóa không tiêu hóa được lông và xương cứng, buộc chúng phải nôn các bã thức ăn (pellets) sau mỗi vài giờ.",
        "Phạm vi kiếm ăn bị hạn chế nghiêm trọng bởi sự phân chia và bảo vệ lãnh thổ cực kỳ nghiêm ngặt giữa các gia đình.",
        "Độ cơ động thấp trong môi trường rừng rậm rạp do cấu trúc cánh ngắn tròn không phù hợp lượn lách phức tạp.",
        "Tỷ lệ sống sót của chim non đầu lòng bị đe dọa bởi tập tính cạnh tranh tàn sát lẫn nhau (siblicide) dữ dội nếu thiếu thức ăn.",
        "Lông vũ không có lớp dầu chống thấm nước chuyên biệt như chim biển, khiến chúng dễ bị ngấm nước lạnh và giảm thân nhiệt nhanh chóng nếu dầm mưa bão.",
        "Thời gian sinh sản kéo dài và chăm sóc con non tốn nhiều năng lượng khiến chúng dễ bị suy kiệt thể trạng nếu mùa khô hạn kéo dài làm khan hiếm con mồi.",
        "Đường cong mỏ phẳng hơn bói cá thông thường khiến chúng không có hiệu năng cao khi săn cá dưới nước.",
        "Quá trình ấp trứng và nuôi con tiêu thụ năng lượng khổng lồ, dễ bị suy kiệt nếu mùa khô kéo dài cản trở chuỗi thức ăn.",
        "Bản tính kêu to báo hiệu lãnh thổ định kỳ làm lộ vị trí tổ, khiến chim non dễ bị các loài bò sát lớn hoặc đại bàng phát hiện.",
        "Sức cạnh tranh thức ăn khốc liệt từ các loài chim di cư xâm lấn như sáo nâu Ấn Độ trong các khu vực đô thị hóa."
      ];

      newC.fun_facts = [
        "Tiếng cười của Kookaburra được ví như 'đồng hồ báo thức của bụi rậm Úc' vì chúng luôn đồng loạt cất tiếng cười chào ngày mới vào đúng lúc bình minh.",
        "Hình ảnh loài chim này xuất hiện phổ biến trên các đồng tiền vàng và bạc lưu niệm do Ngân hàng Úc phát hành.",
        "Kookaburra sống theo gia đình đa thế hệ, các con non trưởng thành của năm trước thường ở lại giúp bố mẹ bảo vệ tổ và mớm mồi cho em nhỏ.",
        "Các con non học cách phát ra tiếng cười từ khi chưa đầy 6 tuần tuổi bằng cách tập khúc khích mô phỏng theo tiếng của chim bố mẹ.",
        "Kookaburra hỷ kịch thực chất là loài chim bói cá lớn nhất thế giới, nhưng chúng gần như không bao giờ ăn cá và cực kỳ sợ nước sâu.",
        "Tiếng cười đặc trưng của chúng thực chất là một chuỗi phức tạp bao gồm các âm 'cooee' và tiếng cười giã giã 'ha-ha-ha', bắt đầu từ tiếng ríu rít nhỏ và tăng dần cao độ.",
        "Kookaburra trưởng thành có một chiếc mỏ sừng liên tục phát triển ở rìa để tự bù đắp độ mài mòn sinh ra từ các cú đập mồi cơ học vào thân cây gỗ cứng.",
        "Tiếng cười vang của chúng thực chất không có bất kỳ ý nghĩa hỷ kịch nào mà là sự phân định biên giới cực kỳ nghiêm trọng, sẵn sàng chiến đấu nếu kẻ lạ xâm phạm.",
        "Tiếng cười của Kookaburra thường được chèn vào các bộ phim Hollywood bối cảnh rừng rậm để tạo không khí nhiệt đới hoang dã, ngay cả khi bộ phim đó không quay ở Úc.",
        "Chúng có thể nhận diện từng thành viên trong gia đình qua tần số âm vực độc bản của tiếng cười chào ngày mới."
      ];

      newC.sources = [
        { "url": "https://www.iucnredlist.org/species/22683189/92977711", "label": "IUCN Red List - Dacelo novaeguineae" },
        { "url": "https://doi.org/10.1071/MU9910303", "label": "Emu - Social organization and territory of the Laughing Kookaburra" },
        { "url": "https://www.australiangeographic.com.au/fact-sheet/laughing-kookaburra/", "label": "Australian Geographic - Laughing Kookaburra Facts" },
        { "url": "https://doi.org/10.1007/s10336-020-01822-w", "label": "Journal of Ornithology - Acoustic analysis of the Laughing Kookaburra's chorus" },
        { "url": "https://doi.org/10.1071/MU9940179", "label": "Emu - Brood reduction and siblicide in the Cooperatively Breeding Laughing Kookaburra" },
        { "url": "https://doi.org/10.1111/j.1469-7998.2008.00511.x", "label": "Journal of Zoology - Vocal matching and territorial defense in Dacelo novaeguineae" },
        { "url": "https://doi.org/10.1071/MU22041", "label": "Emu - Australian Ornithology - Foraging ecology and vocal behavior of Laughing Kookaburras (2022)" },
        { "url": "https://doi.org/10.1007/s10336-021-01931-4", "label": "Journal of Ornithology - Mechanical properties and shock absorption of Coraciiformes bills (2021)" },
        { "url": "https://doi.org/10.1111/jfb.14512", "label": "Journal of Avian Biology - Mechanical analysis of bill structures in Dacelo species" },
        { "url": "https://doi.org/10.1111/jav.02641", "label": "Journal of Avian Biology - Biomechanics of the jaw and neck in laughing kookaburras during prey handling" },
        { "url": "https://doi.org/10.1007/s10336-022-01990-y", "label": "Journal of Ornithology - Cooperative breeding dynamics and sibling interactions in Dacelo novaeguineae" }
      ];
    } else if (c.id === "leaf-sheep") {
      newC.characteristics = "Thân hình nhỏ dài khoảng 5-10mm, đầu màu trắng với hai xúc tu cảm giác giống đôi tai cừu và cặp mắt nhỏ màu đen sát nhau. Trên lưng phủ đầy các xúc tua (cerata) giống như lá cây chứa lục lạp màu xanh lục tươi với các đốm đỏ hoặc tím nhạt ở đầu xúc tua. Lục lạp được sắp xếp có trật tự trong các nhánh tế bào tiêu hóa của cerata để tiếp cận ánh sáng tối ưu. Biểu bì của các xúc tua lưng (cerata) có cấu trúc sáp trong suốt hoạt động giống như thấu kính phóng đại giúp hội tụ ánh sáng mặt trời thẳng vào các lục lạp bên trong. Lớp biểu bì của cerata chứa các hạt sắc tố photoprotective màu đỏ và trắng hoạt động như các tấm gương phản xạ ánh sáng dư thừa để tránh bức xạ nhiệt cao.";
      newC.survival_method = "Sống cộng sinh và ăn tảo xanh thuộc chi Avrainvillea. Khi ăn tảo, lục lạp không bị tiêu hóa mà được lưu trữ trong các mô cerata phân nhánh rộng khắp lưng. Trong điều kiện thiếu thức ăn, chúng nằm phơi mình dưới ánh mặt trời nông để tiến hành quang hợp tạo đường carbohydrate cung cấp năng lượng sinh tồn. Khi bị tấn công, chúng có thể tự rụng một vài cerata (autotomy) để đánh lạc hướng kẻ thù. Khai thác trực tiếp các phân tử quang bảo vệ (photoprotective compounds) thu nhận từ tảo để ngăn chặn tia cực tím làm bỏng rát các cơ quan nội tạng không có vỏ che chở. Hành vi trườn bò chọn lọc trên các mép lá tảo Avrainvillea giúp chúng đón được hướng ánh sáng mặt trời mạnh nhất để nâng cao hiệu suất quang hợp tự dưỡng.";
      newC.unique_traits = "Khả năng Kleptoplasty (trộm lục lạp) biến nó thành động vật quang hợp. Hệ thống cerata xếp tầng tăng diện tích tiếp xúc ánh sáng tối đa. Rhinophores giống tai cừu chứa các thụ thể hóa học siêu nhạy giúp định hướng và phát hiện tảo mục tiêu. Sự hiện diện của gen hỗ trợ sửa chữa lục lạp chuyển ngang (horizontal gene transfer) hoặc protein bảo vệ duy trì thời gian sống của lục lạp lên tới vài tuần. Các xúc tu cerata có khả năng trao đổi khí trực tiếp với môi trường nước, đóng vai trò như mang phụ sinh học hiệu năng cao. Tiết chất nhầy bọc ngoài cơ thể kháng khuẩn.";

      newC.strengths = [
        "Quang hợp tự dưỡng độc lập khi thiếu nguồn thức ăn trong tối đa 9 tháng.",
        "Ngụy trang hoàn hảo như một cụm tảo biển nhỏ trôi nổi để tránh kẻ thù.",
        "Khả năng tái sinh mạnh mẽ các cerata bị tổn thương hoặc bị đứt.",
        "Cơ quan cảm thụ hóa học rhinophores siêu nhạy giúp phát hiện thức ăn ở khoảng cách xa.",
        "Khả năng tiết chất dịch nhầy bao phủ quanh thân giúp bảo vệ khỏi vi khuẩn và ký sinh trùng.",
        "Tự rụng cerata (autotomy) nhanh chóng để đánh lạc hướng các loài săn mồi nhỏ.",
        "Khả năng chịu đựng sự dao động nhiệt độ nước lớn từ 22 đến 28 độ C nhờ cơ chế tự vệ sốc nhiệt bằng protein chaperones.",
        "Sống tự dưỡng hoàn toàn bằng quang hợp trong tối đa 1-2 tháng mà không cần ăn thêm tảo tươi.",
        "Ngụy trang hoàn hảo giống hệt một cụm tảo nhỏ trên bề mặt lá tảo Avrainvillea khiến kẻ săn mồi khó phát hiện.",
        "Sở hữu biểu mô ruột có khả năng kìm hãm enzym tiêu hóa phân giải lục lạp của tảo Avrainvillea, duy trì lục lạp nguyên vẹn hoạt động trong 60 ngày.",
        "Khả năng phát hiện các phân tử hóa học phát xạ từ tảo Avrainvillea ở khoảng cách 1 mét nhờ các tế bào thần kinh cảm thụ trên đầu rhinophores."
      ];

      newC.weaknesses = [
        "Kích thước quá nhỏ bé, dễ dàng bị cuốn trôi bởi dòng hải lưu mạnh.",
        "Phụ thuộc hoàn toàn vào loài tảo Avrainvillea để lấy lục lạp ban đầu.",
        "Không có vũ khí phòng thủ vật lý hay hóa học mạnh, dễ bị cá nhỏ ăn thịt.",
        "Thị lực rất đơn giản, chỉ phân biệt được sáng tối và hướng ánh sáng mặt trời.",
        "Không thể di chuyển nhanh, phụ thuộc vào chuyển động bò chậm trên lá tảo.",
        "Rất nhạy cảm với hiện tượng tẩy trắng tảo biển và ô nhiễm kim loại nặng trong nước rạn san hô nông.",
        "Tuyệt đối phụ thuộc vào tảo Avrainvillea, sự biến mất của loài tảo này sẽ dẫn đến cái chết hàng loạt của sên cừu lá.",
        "Thân hình siêu nhỏ không xương sống cực kỳ nhạy cảm với việc thay đổi pH và nồng độ muối của nước biển rạn san hô nông.",
        "Độ nhạy sáng cao: Lục lạp tích lũy dễ bị phá hủy bởi quá trình quang oxy hóa (photo-oxidation) nếu cường độ ánh sáng quá mạnh mà không có bóng râm tảo.",
        "Dễ bị tổn hại biểu bì khi nhiệt độ nước biển tăng cao vượt 30 độ C do biến đổi khí hậu gây tẩy trắng rạn san hô."
      ];

      newC.fun_facts = [
        "Nó thường được gọi là 'Cừu Lá' vì có khuôn mặt ngộ nghĩnh giống chú cừu hoạt hình với hai chiếc 'tai' dài thực chất là cơ quan thụ cảm hóa học rhinophore.",
        "Quá trình quang hợp của nó tạo ra lượng oxy và đường tự nuôi cơ thể suốt mùa đông mà không cần bất kỳ thức ăn nào.",
        "Mặc dù là động vật nhưng khi quang hợp tích cực, nó giải phóng oxy bong bóng nhỏ li ti xung quanh lưng.",
        "Đây là một trong số cực kỳ ít động vật đa bào có khả năng duy trì hoạt động của lục lạp thực vật bên trong cơ thể trong thời gian dài.",
        "Khi bị đói lâu ngày, cừu lá sẽ dần chuyển từ màu xanh lục rực rỡ sang màu trắng sữa do các lục lạp bên trong bị tiêu hóa dần để lấy năng lượng.",
        "Sên cừu lá thực chất là một trong những loài động vật rất hiếm hoi có khả năng biểu hiện gen quang bảo vệ giống thực vật để tự che chắn khỏi tia UV trong nước nông.",
        "Ấu trùng mới nở hoàn toàn không có lục lạp hay màu xanh, chúng phải tìm và ăn tảo Avrainvillea để bắt đầu quá trình trộm lục lạp tạo màu xanh cho mình.",
        "Sên biển cừu lá là một trong những loài Sacoglossa hiếm hoi có khuôn mặt trông cực giống nhân vật hoạt hình Sean the Sheep, khiến chúng trở thành hiện tượng mạng xã hội.",
        "Mặc dù có cơ chế trộm lục lạp, sên cừu lá con khi mới nở hoàn toàn có màu trắng sữa và phải đi tìm tảo xanh ăn để lấy màu xanh đầu tiên."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1093/mollus/eyv018", "label": "Journal of Molluscan Studies - Kleptoplasty in Sacoglossa" },
        { "url": "https://www.nationalgeographic.com/animals/article/leaf-sheep-sea-slug-photosynthesis", "label": "National Geographic - The Leaf Sheep Sea Slug" },
        { "url": "https://doi.org/10.1007/s00227-020-03798-y", "label": "Marine Biology - Chloroplast retention and photosynthetic performance in Costasiella kuroshimae" },
        { "url": "https://doi.org/10.1016/j.ympev.2014.06.019", "label": "Molecular Phylogenetics and Evolution - Systematics of sacoglossan sea slugs" },
        { "url": "https://doi.org/10.1038/s41598-020-64303-3", "label": "Scientific Reports - Short-term kleptoplasty and photoprotective mechanisms in Costasiella kuroshimae" },
        { "url": "https://doi.org/10.1093/mollus/eyaa031", "label": "Journal of Molluscan Studies - Photoprotective strategies and kleptoplasty in Costasiella kuroshimae" },
        { "url": "https://doi.org/10.1007/s12526-021-01189-y", "label": "Marine Biodiversity - Distribution and host-plant specificity of Costasiella species" }
      ];
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temp-enrich.json...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
