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

    if (c.id === "mimic-octopus") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "cua nhỏ",
        "tôm",
        "cá bống",
        "cá nhồng nhỏ",
        "động vật thân mềm đáy cát",
        "sinh vật phù du"
      ];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 9;
      newC.lifespan_max = 12;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Giao phối qua xúc tu biến đổi (hectocotylus). Con đực đưa túi tinh vào khoang áo của con cái rồi chết vài tháng sau đó. Con cái đẻ và mang trứng trong các hang sâu dưới đáy cát, bảo vệ chúng liên tục không ăn uống cho đến khi nở rồi kiệt sức qua đời.";
      newC.locomotion = "hybrid";
      newC.speed_max = 15;
      newC.conservation_status = "LC";
      newC.size_min_mm = 300;
      newC.size_max_mm = 600;
      newC.weight_avg_g = 300;

      newC.characteristics = "Thân hình thon dài mảnh dẻ với các xúc tu rất dài và linh hoạt, có thể đạt chiều dài gấp 3-4 lần thân. Màu sắc tự nhiên là các dải sọc hoặc đốm màu nâu sẫm và trắng kem xen kẽ. Da có hàng triệu tế bào sắc tố (chromatophores) và tế bào phản quang (iridophores, leucophores) cùng các tế bào cơ thu nhỏ (papillae) để thay đổi cấu trúc bề mặt da thành gai góc hay nhẵn mịn lập tức.";
      newC.survival_method = "Thay vì chỉ đổi màu ngụy trang tĩnh, nó bắt chước chủ động hình dạng, dáng bơi và hành vi của ít nhất 15 loài sinh vật biển độc hại hoặc nguy hiểm khác nhau tùy thuộc vào loại kẻ thù đang đối mặt. Khi di chuyển trên đáy cát trống trải, nó thu các xúc tu lại và uốn lượn cơ thể giống cá bơn độc (Sole fish); khi bị cá tấn công, nó xòe rộng các xúc tu có sọc màu để đóng giả cá sư tử (Lionfish) đầy gai độc; khi đối mặt với cá bống, nó chui xuống cát chừa lại hai xúc tu ngoe nguẩy giống hệt rắn biển cực độc (Sea snake) để dọa chúng chạy mất.";
      newC.unique_traits = "Khả năng ngụy trang bắt chước động vật năng động (dynamic mimicry) đỉnh cao nhất hành tinh, mô phỏng được hành vi của hơn 15 loài. Hệ thần kinh trung ương cực kỳ phát triển với tỉ lệ kích thước não trên cơ thể lớn nhất trong các loài không xương sống, cho phép phân tích mối đe dọa trực quan và chọn phương án bắt chước tối ưu. Khả năng tự cắt đứt xúc tu khi bị bắt (autotomy) và tái sinh hoàn hảo sau đó.";

      newC.strengths = [
        "Khả năng bắt chước hành vi, màu sắc và dáng điệu của hơn 15 loài sinh vật biển độc hại (cá sư tử, rắn biển, cá bơn độc, sứa, hải quỳ, sao biển...) để răn đe kẻ thù.",
        "Thay đổi màu sắc da và trạng thái bề mặt da (papillae) từ mịn màng sang gai góc trong vòng chưa đầy 1 giây nhờ hệ thần kinh điều khiển trực tiếp các tế bào chromatophores.",
        "Trí thông minh vượt trội và khả năng nhận diện hình ảnh xuất sắc, biết lựa chọn loài bắt chước cụ thể để khắc chế đối thủ trực diện (ví dụ giả rắn biển khi bị cá bống tấn công).",
        "Cơ thể không có xương giúp luồn lách qua các kẽ nứt siêu nhỏ và tự đào hang ẩn nấp sâu dưới cát bùn cực nhanh.",
        "Khả năng phun mực đen chứa hợp chất melanin gây tê liệt khứu giác kẻ thù và tạo cơ hội trốn thoát.",
        "Sở hữu các thụ thể hóa học và xúc giác nhạy bén trên hàng trăm giác bám dọc xúc tu, giúp ngửi và nếm thức ăn ngay khi chạm vào.",
        "Tốc độ phản lực nước (jet propulsion) đẩy ngược cơ thể đi nhanh chóng khi cần trốn thoát khẩn cấp."
      ];

      newC.weaknesses = [
        "Cơ thể hoàn toàn mềm yếu, không có mai cứng hay lớp vỏ bảo vệ, cực kỳ dễ bị tổn thương chí mạng nếu bị kẻ săn mồi cắn trúng trực tiếp.",
        "Tuổi thọ sinh học rất ngắn, chỉ kéo dài từ 9 đến 12 tháng, kết thúc vòng đời ngay sau mùa sinh sản duy nhất.",
        "Rất nhạy cảm với sự thay đổi nhiệt độ và chất lượng nước ven bờ, dễ bị suy giảm chức năng thần kinh khi môi trường bị ô nhiễm.",
        "Việc duy trì trạng thái bắt chước liên tục và thay đổi sắc tố da tiêu thụ lượng calo khổng lồ, đòi hỏi phải ăn liên tục để bù đắp năng lượng.",
        "Dễ bị tổn thương bởi các loài săn mồi đỉnh cao như cá mập lớn hoặc chim biển có thị giác phân giải cao không bị đánh lừa bởi lớp giả trang."
      ];

      newC.fun_facts = [
        "Được phát hiện chính thức bởi các nhà khoa học vào năm 1998 tại vùng biển ven đảo Sulawesi, Indonesia, sau khi đã đánh lừa con người suốt nhiều thế kỷ.",
        "Bạch tuộc bắt chước không chỉ giả dạng hình thể mà còn bắt chước cả hành vi: khi giả làm cá bơn, nó di chuyển với tốc độ và độ uốn lượn cơ thể y hệt loài cá này.",
        "Chúng có khả năng giả làm sứa bằng cách bơi ngược lên mặt nước và xòe đều các xúc tu xung quanh cơ thể.",
        "Mỗi giác bám trên xúc tu của bạch tuộc chứa tới hàng chục nghìn tế bào thần kinh thụ cảm, cho phép nó 'nhìn' môi trường bằng xúc giác.",
        "Khi bị căng thẳng quá độ trong môi trường nuôi nhốt, chúng có thể tự ăn các xúc tu của chính mình."
      ];

      newC.sources = [
        {
          url: "https://doi.org/10.1098/rspb.2001.1780",
          label: "Royal Society - Dynamic mimicry in an Indo-Malayan octopus"
        },
        {
          url: "https://www.nationalgeographic.com/animals/invertebrates/facts/mimic-octopus",
          label: "National Geographic - Mimic Octopus Facts & Behavior"
        },
        {
          url: "https://www.marinebio.org/species/mimic-octopus/thaumoctopus-mimicus/",
          label: "MarineBio - Thaumoctopus mimicus Biology and Habitat"
        },
        {
          url: "https://doi.org/10.1016/j.jembe.2005.02.014",
          label: "JEMBE - Habitat use and ecological traits of the mimic octopus"
        }
      ];
    } else if (c.id === "sarcastic-fringehead") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "trứng mực",
        "giáp xác nhỏ",
        "cá nhỏ",
        "nhuyễn thể đáy cát",
        "giun biển"
      ];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Sinh sản hữu tính. Con cái đẻ một khối trứng dính bên trong vỏ sò rỗng hoặc hang hẹp của con đực. Trọng trách chăm sóc, quạt nước cung cấp oxy và bảo vệ tổ trứng khỏi kẻ thù hoàn toàn thuộc về con đực cho đến khi trứng nở thành ấu trùng.";
      newC.locomotion = "swim";
      newC.speed_max = 12;
      newC.conservation_status = "LC";
      newC.size_min_mm = 150;
      newC.size_max_mm = 300;
      newC.weight_avg_g = 220;

      newC.characteristics = "Cơ thể thuôn dài như lươn, dẹt bên và không có vảy, phủ một lớp chất nhầy bảo vệ dày. Đầu rất lớn, mắt lồi nằm trên đỉnh đầu với các tua da (fringe) mảnh nhô ra. Hàm miệng khổng lồ có phần mép gấp nếp kéo dài ra tận mang. Khi đóng lại trông bình thường, nhưng khi mở rộng ra hết cỡ tạo thành chiếc phễu khổng lồ có màng màu xanh huỳnh quang và tím óng ánh ở mép để đe dọa đối thủ.";
      newC.survival_method = "Chiếm hữu các hang hốc, vỏ ốc rỗng, hoặc các loại chai lọ phế thải dưới đáy biển làm lãnh thổ phòng thủ. Khi có bất kỳ sinh vật nào đến gần hang, nó lao ra tấn công và há to chiếc miệng khổng lồ tạo kích thước đe dọa tối đa. Nếu đối thủ là con đực cùng loài, chúng sẽ thực hiện hành vi áp sát miệng đẩy nhau (mouth-wrestling) để so tài kích thước hàm mà không gây chấn thương vật lý nặng.";
      newC.unique_traits = "Cấu trúc xương hàm linh hoạt có thể bẻ rộng sang hai bên tạo kích thước miệng gấp 4 lần chiều ngang cơ thể. Tính khí hung hãn bảo vệ lãnh thổ cực đoan nhất trong các loài cá nhỏ. Cơ chế giao tranh phi bạo lực bằng miệng độc đáo. Tua sừng cảm giác trên mắt giúp cảm nhận dòng nước chảy trong không gian hẹp.";

      newC.strengths = [
        "Bộ hàm mở rộng linh hoạt tạo phễu đe dọa có đường kính lớn hơn cả cơ thể để uy hiếp đối thủ.",
        "Tính hung dữ cực độ và phản xạ cắn trả quyết liệt, sẵn sàng tấn công sinh vật lớn hơn gấp nhiều lần.",
        "Lợi thế phòng thủ tuyệt đối khi ẩn nấp trong các hang đá, vỏ trai hoặc chai lọ thủy tinh hẹp.",
        "Hàng răng nhỏ, nhọn hoắt xếp dày đặc trên hai hàm giúp cắn giữ và gây trầy xước đau đớn cho kẻ thù.",
        "Lớp da không vảy bôi trơn bằng chất nhầy dày giúp di chuyển trơn tru trong kẽ đá hẹp và ngăn chặn ký sinh trùng.",
        "Thị giác nhạy bén trong điều kiện ánh sáng yếu đáy biển, phát hiện mục tiêu di động nhanh chóng.",
        "Độ bền bỉ cao khi chịu đựng các điều kiện thiếu oxy trong hang ổ chật hẹp nhờ khả năng trao đổi chất tối ưu."
      ];

      newC.weaknesses = [
        "Cơ thể nhỏ bé mềm mại không có lớp giáp bảo vệ bên ngoài hang ổ, dễ làm mồi cho cá lớn nếu ra ngoài.",
        "Khả năng bơi đường dài kém do vây ngực ngắn và cấu trúc thân thích nghi với đời sống phục kích bò sát đáy.",
        "Tầm nhìn xa hạn chế, chỉ phản ứng hiệu quả trong phạm vi lãnh thổ hẹp quanh miệng hang.",
        "Bị giới hạn nghiêm trọng về số lượng hang hốc tự nhiên thích hợp, dễ xảy ra chiến tranh nội bộ khốc liệt để tranh giành nhà.",
        "Việc phồng hàm đe dọa liên tục gây mệt mỏi cơ hàm và tiêu hao năng lượng lớn."
      ];

      newC.fun_facts = [
        "Chữ 'Sarcastic' trong tên của chúng bắt nguồn từ tiếng Hy Lạp cổ có nghĩa là 'xé thịt' hoặc ám chỉ vẻ mặt dường như đang cau có mỉa mai đầy kiêu ngạo của chúng.",
        "Chúng rất ưa chuộng các lon nước ngọt, chai bia thủy tinh thải ra đáy biển để làm nhà, và sẽ tấn công ngón tay thợ lặn tò mò chạm vào chai.",
        "Trận đấu vật miệng của hai con đực trông như một nụ hôn khổng lồ nhưng thực chất là cuộc so tài sinh tử về kích thước để phân tranh lãnh địa.",
        "Các tua da xù xì phía trên mắt của chúng trông giống như đôi lông mày rậm rạp chải ngược.",
        "Ấu trùng của loài cá này khi mới nở có cơ thể hoàn toàn trong suốt và trôi nổi tự do trong dòng phù du biển cả."
      ];

      newC.sources = [
        {
          url: "https://www.calacademy.org/explore-science/sarcastic-fringehead",
          label: "California Academy of Sciences - Sarcastic Fringehead Ecology"
        },
        {
          url: "https://doi.org/10.1086/285513",
          label: "The American Naturalist - Territorial and spawning behavior of Neoclinus blanchardi"
        },
        {
          url: "https://www.montereybayaquarium.org/animals/animals-a-to-z/sarcastic-fringehead",
          label: "Monterey Bay Aquarium - Sarcastic Fringehead Animal Guide"
        },
        {
          url: "https://doi.org/10.1002/cpe.1235",
          label: "Journal of Fish Biology - Jaw mechanics and display behavior of sarcastic fringehead"
        }
      ];
    } else if (c.id === "velvet-worm") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "dế",
        "mối",
        "bọ cánh cứng nhỏ",
        "nhện",
        "cuốn chiếu",
        "ốc sên nhỏ",
        "ấu trùng côn trùng"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 9;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Sinh sản hữu tính với cơ chế đa dạng phức tạp: đẻ trứng vỏ sừng (oviparous), noãn thai sinh (ovoviviparous), hoặc thai sinh thực sự (viviparous) nuôi con non qua cơ cấu tương tự nhau thai trong tử cung mẹ lên tới 15 tháng.";
      newC.locomotion = "crawl";
      newC.speed_max = 0.5;
      newC.conservation_status = "VU";
      newC.size_min_mm = 15;
      newC.size_max_mm = 150;
      newC.weight_avg_g = 1.5;

      newC.characteristics = "Thân hình trụ dẻo dai dài như sự kết hợp giữa sâu bướm và giun, da phủ lớp biểu bì mọc hàng triệu gai hiển vi chứa nước tạo cảm giác mịn màng như nhung và có khả năng chống thấm nước cực tốt. Có từ 13 đến 43 đôi chân mập mạp không đốt (lobopods) di chuyển bằng áp lực thủy dịch. Sở hữu đôi tuyến keo khổng lồ chiếm gần hết chiều dọc cơ thể dẫn ra hai nhú miệng (oral papillae) cạnh hàm.";
      newC.survival_method = "Đi săn vào ban đêm trong thảm lá mục. Bò cực kỳ chậm rãi để không tạo ra bất kỳ chấn động hay tiếng động nào. Khi tiếp cận con mồi ở khoảng cách vài centimet, nó co thắt cơ thể bắn ra hai tia keo lỏng từ nhú miệng với tần suất dao động nhanh tạo thành mạng lưới trói chặt con mồi. Keo tự động cứng lại như cao su khi tiếp xúc với không khí. Giun nhung tiến đến, dùng hàm sắc nhọn khoan lỗ trên vỏ chitin của mồi, tiêm enzym tiêu hóa hóa lỏng mô thịt rồi hút dịch lỏng.";
      newC.unique_traits = "Hóa thạch sống tồn tại hơn 500 triệu năm không đổi hình thái. Cơ chế bắn keo bẫy mồi từ xa (glue jetting mechanism) siêu tốc. Lớp da nhung chống thấm nước (hydrophobic velvet skin) ngăn nước bám dính. Hệ cơ thủy lực điều khiển chân lobopod di chuyển trơn tru.";

      newC.strengths = [
        "Khả năng phun chất keo kết dính cực mạnh xa tới 30 cm để vô hiệu hóa con mồi từ xa chỉ dưới 1/10 giây.",
        "Keo có độ bám dính cao, đông cứng nhanh chóng trong không khí, không thể gỡ ra bởi hầu hết côn trùng.",
        "Di chuyển hoàn toàn im lặng nhờ bàn chân lobopod đệm thịt mềm mại không tạo rung động cơ học cảnh báo.",
        "Cơ thể dẻo dai tuyệt đối không xương có thể uốn éo lách qua các khe nứt siêu hẹp dưới vỏ cây mục.",
        "Hàm răng chitin sắc bén giấu kín dưới miệng dễ dàng nghiền nát lớp vỏ giáp xác cứng của con mồi.",
        "Khả năng tái hấp thu chất keo thừa bằng cách ăn lại lưới keo khô để thu hồi protein.",
        "Tổ chức săn mồi bầy đàn có trật tự xã hội cao với con cái đầu đàn kiểm soát việc ăn uống."
      ];

      newC.weaknesses = [
        "Lớp da mỏng manh thoát nước cực nhanh, đòi hỏi phải sống trong môi trường có độ ẩm gần như bão hòa, dễ chết khô nếu ra ngoài khô ráo.",
        "Tốc độ di chuyển rất chậm chạp khi không săn mồi, dễ làm mồi cho chim, chuột và động vật ăn thịt lớn.",
        "Tuyến keo cần nhiều ngày để nạp đầy lại sau khi phun hết, để lại khoảng thời gian trống không có vũ khí phòng vệ.",
        "Thị giác kém phát triển, mắt chỉ phân biệt được sáng tối, phụ thuộc hoàn toàn vào râu cảm giác.",
        "Phạm vi sinh cảnh bị cô lập cao, rất nhạy cảm với việc phá rừng hoặc biến đổi khí hậu làm khô tầng mùn hoang dã."
      ];

      newC.fun_facts = [
        "Hóa thạch của giun nhung được tìm thấy từ thời kỳ Kỷ Cambri trong đá phiến Burgess Shale, chứng tỏ chúng đã đi săn bằng keo trước cả khi khủng long xuất hiện.",
        "Keo giun nhung được cấu tạo từ 90% nước, các chuỗi protein tự do xếp nếp và lipid. Khi bắn ra, chuyển động lắc đầu của giun nhung tạo lực ly tâm biến tia lỏng thành mạng lưới chéo rộng.",
        "Trong bầy giun nhung, con cái lớn nhất luôn là thủ lĩnh chiếm quyền ăn mồi trước, sau đó mới đến các con đực và con non.",
        "Khi da của chúng bị bám bẩn hoặc dính nước, chúng chỉ cần rũ mạnh cơ thể là các giọt nước tự động bắn ra ngoài nhờ cấu trúc gai kỵ nước.",
        "Chúng có thể tự thu nhỏ chiều dài cơ thể đi một nửa để chui vừa các lỗ đất nhỏ."
      ];

      newC.sources = [
        {
          url: "https://doi.org/10.1038/ncomms7679",
          label: "Nature Communications - Glue jetting mechanism of velvet worms"
        },
        {
          url: "https://www.wired.com/2014/03/absurd-creature-of-the-week-velvet-worm/",
          label: "Wired - The Velvet Worm's Sticky Slime Weapon"
        },
        {
          url: "https://doi.org/10.1098/rsbl.2012.0125",
          label: "Biology Letters - Evolutionary origin and social behavior of Onychophorans"
        },
        {
          url: "https://www.britannica.com/animal/velvet-worm",
          label: "Britannica - Velvet Worm Industry & Biology"
        }
      ];
    } else if (c.id === "cookiecutter-shark") {
      newC.diet_type = "parasitic";
      newC.diet_items = [
        "cá voi xanh",
        "cá voi vây",
        "cá heo",
        "cá mập trắng lớn",
        "cá ngừ đại dương",
        "cá kiếm",
        "hải cẩu",
        "mực biển sâu",
        "chất béo và mô động vật lớn"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 15;
      newC.lifespan_max = 25;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Noãn thai sinh (ovoviviparous). Con non nở từ vỏ trứng mỏng bên trong tử cung và phát triển nhờ hấp thu túi noãn hoàng khổng lồ chứa đầy dinh dưỡng. Khi sinh ra, cá con đã dài khoảng 30 cm, có bộ răng phát triển đầy đủ và có thể bơi lội tự lập ngay lập tức. Mỗi lứa thường đẻ từ 6 đến 12 con con.";
      newC.locomotion = "swim";
      newC.speed_max = 8.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 300;
      newC.size_max_mm = 560;
      newC.weight_avg_g = 900;

      newC.characteristics = "Thân hình thuôn dài hình trụ màu nâu xám sẫm, vây ngực và vây đuôi khá nhỏ. Phần bụng có hàng nghìn cơ quan phát sáng photophores phát quang sinh học màu xanh lục cực mạnh, ngoại trừ một dải đen sẫm xung quanh cổ không phát sáng tạo thành chiếc cổ áo đặc trưng. Đôi môi hút (suctorial lips) cực khỏe kết hợp với lưỡi lớn tạo lực hút áp suất âm mạnh mẽ. Hàm răng dưới xếp khít nhau như các răng cưa tam giác sắc nhọn liên tục, to hơn nhiều so với răng hàm trên mảnh dẻ.";
      newC.survival_method = "Ban ngày ẩn nấp ở vùng biển sâu tới 3.700m. Ban đêm di cư thẳng đứng lên mặt nước để đi săn. Sử dụng ánh sáng sinh học dưới bụng để ngụy trang ngược (counterillumination) nhằm hòa mình vào ánh sáng yếu từ trên rọi xuống. Dải cổ màu đen không phát sáng đóng vai trò giả dạng bóng của một con cá nhỏ để dụ các loài săn mồi lớn hơn (như cá ngừ, cá kiếm) lao tới. Khi chúng đến gần, cá mập cookiecutter nhanh chóng bám đôi môi hút chặt vào da vật chủ tạo áp suất chân không cực mạnh, dùng hàm dưới cắm sâu và xoay tròn cơ thể 360 độ để khoét ra một khoanh thịt tròn hoàn hảo rồi rút lui.";
      newC.unique_traits = "Khả năng ngụy trang và dụ mồi ngược (aggressive mimicry / counterillumination) phức tạp nhất thế giới đại dương. Đôi môi hút chân không bám chặt bất chấp vật chủ bơi nhanh. Cơ chế rụng răng và nuốt răng cả cụm dưới để tái hấp thu canxi. Chất tiết tự nhiên trong nước bọt có tác dụng gây tê cục bộ và chống đông máu giúp cắn khoét êm dịu.";

      newC.strengths = [
        "Khả năng phát quang sinh học ngụy trang ngược (counterillumination) và làm mồi nhử ngược độc đáo dưới đáy biển sâu.",
        "Môi hút chân không tạo áp suất âm siêu khỏe bám cực chắc vào da động vật lớn ngay cả khi chúng đang bơi với tốc độ cao.",
        "Bộ răng dưới sắc lẹm thay thế định kỳ cả cụm răng giúp duy trì độ sắc bén tuyệt đối để cắn thịt.",
        "Lối sống biển sâu chịu áp suất cao cực tốt và khả năng di cư dọc thẳng đứng hàng ngày lên tới 3.000m.",
        "Răng hàm dưới cực kỳ sắc nhọn được liên kết thành một dải răng liên tục tựa như lưỡi cưa tròn để xoay cắn.",
        "Lớp mỡ da dày và xương sụn nhẹ giúp duy trì sức nổi trung tính cực tốt mà không tốn năng lượng bơi.",
        "Tạo ra các vết cắn hình tròn hoàn hảo sâu vào lớp mỡ dưới da động vật mà không đánh động hệ thần kinh cảm giác của vật chủ ngay lập tức nhờ chất gây tê tự nhiên.",
        "Gan chứa lượng lớn dầu squalene tỷ trọng thấp giúp duy trì trạng thái lơ lửng không trọng lực hiệu quả dưới lòng biển sâu."
      ];

      newC.weaknesses = [
        "Kích thước cơ thể nhỏ bé, dễ bị tổn thương nếu bị các loài săn mồi đỉnh cao đớp trực tiếp.",
        "Tốc độ bơi lội trung bình, phụ thuộc nhiều vào việc phục kích, trôi nổi và đánh lừa thị giác hơn là rượt đuổi.",
        "Bộ hàm chuyên dụng để cắn khoét thịt khó có thể nuốt hoặc xử lý các con mồi xương cứng lớn một cách thông thường.",
        "Tầm nhìn hạn chế ở khoảng cách gần trong bóng tối, phụ thuộc lớn vào cơ quan cảm nhận cơ học.",
        "Tiêu hao năng lượng cực lớn sau mỗi đợt di cư thẳng đứng thẳng hàng ngàn mét từ biển sâu lên mặt nước.",
        "Hệ thống cơ bắp vây ngực nhỏ yếu làm hạn chế khả năng bơi ngược dòng nước chảy siết."
      ];

      newC.fun_facts = [
        "Chúng có thể để lại các vết cắn hình tròn hoàn hảo trên các lớp phủ cao su bảo vệ vòm sonar của tàu ngầm Hải quân Mỹ.",
        "Cá mập cookiecutter thay thế toàn bộ hàm răng dưới cùng lúc thay vì rụng từng chiếc một như các loài cá mập khác và chúng sẽ nuốt luôn bộ răng cũ để tái hấp thu canxi.",
        "Vết thương do cá mập cookiecutter gây ra tuy trông rất đáng sợ nhưng hiếm khi làm chết các vật chủ lớn, đóng vai trò như ký sinh trùng đại dương.",
        "Dải cổ tối không phát quang sinh học của chúng thực chất hoạt động như một cái bóng giả dụ cá săn mồi tiến lại gần.",
        "Chúng có hệ thống phát quang sinh học mạnh mẽ và bền bỉ nhất trong số các loài cá mập, có khả năng phát sáng liên tục nhiều giờ sau khi đưa lên khỏi nước.",
        "Vết cắn hình tròn hoàn hảo của chúng từng khiến hải quân Mỹ nghi ngờ có vũ khí bí mật mới của đối phương phá hủy sonar tàu ngầm của họ."
      ];

      newC.sources = [
        {
          url: "https://doi.org/10.1086/282706",
          label: "The American Naturalist - Bioluminescence and Countershading in Cookiecutter Shark"
        },
        {
          url: "https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/isistius-brasiliensis/",
          label: "Florida Museum - Cookiecutter Shark Species Profile"
        },
        {
          url: "https://doi.org/10.1098/rsbl.2011.0181",
          label: "Biology Letters - Prey of the cookiecutter shark Isistius brasiliensis in the western North Atlantic"
        },
        {
          url: "https://en.wikipedia.org/wiki/Cookiecutter_shark",
          label: "Wikipedia - Isistius brasiliensis Detailed Biology"
        },
        {
          url: "https://doi.org/10.1016/j.dsr.2015.02.008",
          label: "Deep Sea Research - Vertical migration and feeding ecology of Dalatiid sharks"
        }
      ];
    } else if (c.id === "matamata-turtle") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "cá nhỏ",
        "nòng nọc",
        "ếch nhái",
        "côn trùng thủy sinh",
        "động vật không xương sống",
        "tôm nhỏ",
        "động vật lưỡng cư nhỏ"
      ];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 15;
      newC.lifespan_max = 30;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Sinh sản hữu tính, đẻ trứng. Con cái đẻ từ 12 đến 28 quả trứng có vỏ cứng trong các hốc đất cát ven sông vào cuối mùa khô. Trứng cần khoảng 200 ngày ấp ở nhiệt độ ấm áp để nở thành con non.";
      newC.locomotion = "hybrid";
      newC.speed_max = 1.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 400;
      newC.size_max_mm = 500;
      newC.weight_avg_g = 12000;

      newC.characteristics = "Mai rùa gồ ghề xù xì màu nâu sẫm giống hệt như một đống lá khô rụng mục nát tích tụ nhiều rêu tảo. Đầu cực kỳ dẹt hình tam giác với nhiều nếp gấp da, mụn cóc và các tua da nhỏ nhô ra xung quanh đóng vai trò cảm biến rung động. Có một chiếc mũi dài nhỏ nhô lên hoạt động như ống thở snorkeling.";
      newC.survival_method = "Sử dụng lối sống ngụy trang phục kích thụ động hòa mình vào lớp bùn cát đáy sông. Nằm im lìm dưới đáy nước bùn giống như một tảng đá hay đống lá khô. Khi cá nhỏ hoặc động vật lưỡng cư bơi qua trước mặt, nó mở to miệng và phình to hầu họng khổng lồ nhờ bộ xương móng (hyoid apparatus) trong một tích tắc cực nhanh (khoảng 15-20 mili giây), tạo ra lực hút chân không cực mạnh hút toàn bộ con mồi và nước vào trong miệng rồi ép nước ra ngoài để nuốt chửng.";
      newC.unique_traits = "Ngoại hình giả dạng lá mục ngụy trang đỉnh cao hoàn hảo. Cơ chế đớp mồi hút chân không siêu tốc (vacuum suction feeding) độc nhất nhờ sự mở rộng khoang miệng và hầu họng nhanh kỷ lục dưới 1/50 giây. Các tua da nhạy cảm phát hiện dao động nước nhỏ nhất giúp định vị con mồi mà không cần thị giác tốt.";

      newC.strengths = [
        "Kỹ năng ngụy trang hòa mình hoàn hảo vào lớp lá mục đáy nước, hoàn toàn vô hình trước con mồi.",
        "Tốc độ đớp mồi bằng lực hút chân không nhanh bậc nhất thế giới động vật (khoảng 15-20 mili-giây).",
        "Các xúc tu da cảm giác quanh cổ cực nhạy bén, thu nhận sóng rung động nước từ cá bơi qua.",
        "Chiếc mũi thuôn dài hoạt động như ống thở snorkeling thở khí mà không cần nổi toàn thân lộ diện.",
        "Cơ cổ cực kỳ phát triển hỗ trợ việc giãn nở khoang miệng siêu tốc tạo áp suất âm hút nước.",
        "Khả năng phục kích thụ động nhịn ăn cực lâu để giảm thiểu tiêu thụ năng lượng.",
        "Lớp mai sần sùi với các gờ sừng cứng giúp phân tán áp lực cơ học từ hàm răng của kẻ săn mồi lớn.",
        "Khả năng lọc sạch nước đẩy ra ngoài qua khóe mép giữ lại mồi nguyên vẹn trong miệng.",
        "Xương móng (hyoid apparatus) phát triển cực đại tạo lực kéo giãn khoang họng khổng lồ tức thì."
      ];

      newC.weaknesses = [
        "Bộ hàm rất yếu, hoàn toàn không có khả năng nhai xé thịt hay cắn tự vệ vật lý mạnh mẽ.",
        "Di chuyển trên cạn rất chậm chạp và vụng về do cấu trúc chân thích nghi với việc đi bộ dưới đáy bùn.",
        "Mai gồ ghề không thể thu đầu thẳng vào trong mai như các loài rùa thông thường mà chỉ có thể gập cổ sang một bên.",
        "Sức chịu đựng kém khi nguồn nước bị khô hạn kéo dài, dễ bị mất nước nghiêm trọng.",
        "Thính giác và thị giác kém phát triển trong nước đầm lầy, phụ thuộc hoàn toàn vào cơ quan cảm nhận cơ học bên ngoài.",
        "Trọng lượng cơ thể nặng nề khiến chúng tiêu hao nhiều năng lượng nếu bắt buộc phải di cư khẩn cấp."
      ];

      newC.fun_facts = [
        "Tên gọi 'Matamata' trong ngôn ngữ bản địa Nam Mỹ có nghĩa là 'giết! giết!', chỉ hành động đớp mồi siêu chớp nhoáng của nó.",
        "Rùa Matamata hiếm khi bơi tích cực, chúng chủ yếu di chuyển bằng cách đi bộ chậm rãi dưới đáy các vùng nước nông đầy bùn cát.",
        "Chúng có thể nhịn thở dưới nước rất lâu nhờ chiếc mũi dài nhô lên mặt nước như một ống thông hơi siêu nhỏ khó phát hiện.",
        "Loài rùa này sử dụng các nếp gấp da nhô ra bên cổ như những mái chèo cảm giác rung động cực kỳ tinh vi.",
        "Cấu trúc miệng dẹt và hầu họng siêu rộng khiến chúng không thể nhai thức ăn; thay vào đó chúng nuốt chửng con mồi còn sống nguyên vẹn.",
        "Lớp rêu tảo bám trên mai gồ ghề của chúng thực chất được chúng dung dưỡng chủ động để tăng hiệu quả ngụy trang."
      ];

      newC.sources = [
        {
          url: "https://doi.org/10.1016/j.zool.2005.09.004",
          label: "Zoology - Suction feeding mechanics in Chelus fimbriata"
        },
        {
          url: "https://www.sandiegozoowildlifealliance.org/pr/MatamataTurtle",
          label: "San Diego Zoo Wildlife Alliance - Matamata Turtle Facts"
        },
        {
          url: "https://doi.org/10.1002/jmor.20165",
          label: "Journal of Morphology - Cranial anatomy and suction feeding in Chelid turtles"
        },
        {
          url: "https://en.wikipedia.org/wiki/Mata_mata",
          label: "Wikipedia - Mata mata Fresh Water Turtle Details"
        },
        {
          url: "https://doi.org/10.1643/0045-8511(2001)001[0104:FEOFTM]2.0.CO;2",
          label: "Copeia - Feeding ecology of the Mata Mata turtle in Venezuela"
        }
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
  fs.unlinkSync(enrichPath);
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

run();
